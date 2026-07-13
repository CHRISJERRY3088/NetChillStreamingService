app.get('/api/episodes/:id', async (req, res) => {
    res.json({ quality: "1080p", size: "", format: "MP4", source: "supabase-placeholder" });
});