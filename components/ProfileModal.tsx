"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, updateUser } = useAuth();
    const [nickname, setNickname] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        if (user && isOpen) {
            setNickname(user.nickname || "");
            setUserId(user.id || "");
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleUpdate = () => {
        if (!nickname.trim() || !userId.trim()) {
            alert("닉네임과 아이디를 모두 입력해주세요.");
            return;
        }
        updateUser({ nickname, id: userId });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">내 프로필</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                        type="button"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-[#5E81FF] flex items-center justify-center overflow-hidden border-4 border-zinc-800 shadow-inner">
                                <div className="relative w-full h-full flex flex-col items-center justify-end">
                                    <div className="w-16 h-20 bg-[#5E81FF] rounded-t-full flex justify-center pt-6">
                                        <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 bg-[#1A1C1E] rounded-full shadow-sm"></div>
                                            <div className="w-1.5 h-1.5 bg-[#1A1C1E] rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 text-[11px] text-white font-bold hover:bg-zinc-700 transition-colors shadow-xl">
                                편집
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">닉네임</label>
                            <Input
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white h-12 rounded-xl focus:ring-zinc-600 px-4"
                                placeholder="닉네임을 입력하세요"
                            />
                            <p className="text-xs text-zinc-500">20자 이내 한글, 영문, 숫자 사용 가능</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">아이디</label>
                            <Input
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white h-12 rounded-xl focus:ring-zinc-600 px-4"
                                placeholder="아이디를 입력하세요"
                            />
                            <p className="text-xs text-zinc-500">4~20자 이내 영문, 숫자 사용 가능</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4 pt-4">
                        <Button
                            onClick={handleUpdate}
                            className="w-full h-14 bg-zinc-400 hover:bg-zinc-300 text-zinc-900 font-bold text-lg rounded-full transition-all"
                            type="button"
                        >
                            변경
                        </Button>
                        <button className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline-offset-4 hover:underline">
                            회원탈퇴
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
