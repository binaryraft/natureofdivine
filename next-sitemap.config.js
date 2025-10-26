/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.natureofthedivine.com",
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.8,
  sitemapSize: 5000,
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://www.natureofthedivine.com/sitemap.xml',
    ],
  },
};
