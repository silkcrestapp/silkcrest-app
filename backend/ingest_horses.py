import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the root or frontend folder
load_dotenv(dotenv_path="../frontend/.env")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Ensure your .env file is configured correctly.")

# Initialize the Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upsert_horses_batch(horse_list: list):
    """
    Accepts a list of dictionaries formatted to match the Supabase 'horses' schema
    and performs a highly efficient bulk upsert.
    """
    try:
        print(f"Starting bulk ingestion for {len(horse_list)} horses...")
        
        # Execute bulk upsert via Supabase Python API
        response = supabase.table("horses").upsert(horse_list).execute()
        
        print("🎉 Ingestion completed successfully!")
        return response.data
    except Exception as e:
        print(f"❌ Error during database ingestion: {e}")
        return None

if __name__ == "__main__":
    # This is a sample layout of how your raw data arrays will look
    mock_scraped_data = [
        {
            "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
            "name": "Mejiro McQueen",
            "name_jp": "メジロマックイーン",
            "gender": "Male",
            "birth_year": 1987,
            "coat_color": "Gray",
            "bloodline_type": "St. Simon Line",
            "speed": 77,
            "stamina": 95, # High endurance profile
            "power": 75,
            "guts": 82,
            "intelligence": 90
        }
    ]
    
    upsert_horses_batch(mock_scraped_data)