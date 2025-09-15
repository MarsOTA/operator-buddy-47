-- Create policy to allow anonymous users to view operators for registration
CREATE POLICY "Anonymous users can view operators for registration" 
ON public.operators 
FOR SELECT 
TO anon, authenticated
USING (true);