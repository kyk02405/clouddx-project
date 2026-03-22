param(
    [string]$AwsRegion = "ap-northeast-2",
    [string]$Namespace = "tutum-app",
    [string]$IngressName = "sonar-ingress",
    [string]$ServiceName = "sonarqube-external"
)

$ErrorActionPreference = "Stop"

function Get-Json {
    param([string]$Command)
    $raw = Invoke-Expression $Command
    if (-not $raw) {
        return $null
    }
    return $raw | ConvertFrom-Json
}

try {
    $lbDns = kubectl get ingress $IngressName -n $Namespace -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    if (-not $lbDns) {
        throw "Ingress hostname is empty."
    }

    $endpointJson = kubectl get endpoints $ServiceName -n $Namespace -o json | ConvertFrom-Json
    $address = $endpointJson.subsets[0].addresses[0].ip
    $port = $endpointJson.subsets[0].ports[0].port
    if (-not $address -or -not $port) {
        throw "Service endpoint IP or port is missing."
    }

    $lbArn = aws elbv2 describe-load-balancers `
        --region $AwsRegion `
        --query "LoadBalancers[?DNSName=='$lbDns'].LoadBalancerArn | [0]" `
        --output text
    if (-not $lbArn -or $lbArn -eq "None") {
        throw "Failed to resolve ALB ARN for $lbDns."
    }

    $targetGroups = Get-Json "aws elbv2 describe-target-groups --region $AwsRegion --load-balancer-arn $lbArn --output json"
    $targetGroup = $targetGroups.TargetGroups | Where-Object { $_.TargetGroupName -like "*sonarqub*" } | Select-Object -First 1
    if (-not $targetGroup) {
        throw "Failed to find Sonar target group on $lbArn."
    }

    aws elbv2 register-targets `
        --region $AwsRegion `
        --target-group-arn $targetGroup.TargetGroupArn `
        --targets "Id=$address,Port=$port" | Out-Null

    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Seconds 5
        $health = Get-Json "aws elbv2 describe-target-health --region $AwsRegion --target-group-arn $($targetGroup.TargetGroupArn) --output json"
        $target = $health.TargetHealthDescriptions | Where-Object { $_.Target.Id -eq $address -and $_.Target.Port -eq $port } | Select-Object -First 1
        if ($target -and $target.TargetHealth.State -eq "healthy") {
            Write-Output "Sonar target registered and healthy ($address`:$port)"
            exit 0
        }
    }

    throw "Sonar target did not become healthy in time."
}
catch {
    Write-Error $_
    exit 1
}
