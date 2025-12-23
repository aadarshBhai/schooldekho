import { fetchEvents, Event } from '@/services/eventService';

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://eventdekho.com';
  const currentDate = new Date().toISOString();

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
    { url: '/map', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
    { url: '/login', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
    { url: '/signup', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
  ];

  let eventPages: Array<{ url: string; priority: string; changefreq: string; lastmod: string }> = [];

  try {
    const events = await fetchEvents();
    eventPages = events
      .filter(event => event.approved)
      .map(event => ({
        url: `/post/${event.id}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: event.createdAt
      }));
  } catch (error) {
    console.error('Failed to fetch events for sitemap:', error);
  }

  const allPages = [...staticPages, ...eventPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

// Function to download sitemap
export const downloadSitemap = async () => {
  const sitemap = await generateSitemap();
  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
