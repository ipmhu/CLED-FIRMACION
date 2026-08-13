// supabase.js

const SUPABASE_URL = "https://ulouzxsmswxgcasuqgsk.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsb3V6eHNtc3d4Z2Nhc3VxZ3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTM2NDIsImV4cCI6MjEwMjIyOTY0Mn0.NIFFpCTxS2FQvCfQ0Af4ECAJUoZ3IhYAyvMk-wZ0yLY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);