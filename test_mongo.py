from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv


async def test_connection():
    load_dotenv("backend/.env")
    mongodb_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("MONGODB_DB_NAME")

    print(f"URL: {mongodb_url}")
    print(f"DB: {db_name}")

    client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        print("✅ Connection successful!")

        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(test_connection())
