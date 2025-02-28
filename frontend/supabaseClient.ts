import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://siapwdlehejtwlrhrkvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYXB3ZGxlaGVqdHdscmhya3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4Nzg4NjksImV4cCI6MjA1MjQ1NDg2OX0.D9CyjiM-lUG4YGsk_gotRmaWrXkKbYMMW5dvx4Je59M';

export const supabase = createClient(supabaseUrl, supabaseKey);