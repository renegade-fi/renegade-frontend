module.exports = async (context, opts) => {

  return {
    name: 'html-head-seo',
    injectHtmlTags({ content }) {
      return {
        headTags: [
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '57x57',
              href: '/img/apple/glyph57.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '60x60',
              href: '/img/apple/glyph60.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '72x72',
              href: '/img/apple/glyph72.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '76x76',
              href: '/img/apple/glyph76.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '114x114',
              href: '/img/apple/glyph114.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '120x120',
              href: '/img/apple/glyph120.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '144x144',
              href: '/img/apple/glyph144.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '152x152',
              href: '/img/apple/glyph152.png',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              sizes: '180x180',
              href: '/img/apple/glyph180.png',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'description',
              content: 'Renegade is the on-chain dark pool. MPC-based DEX for anonymous crosses at midpoint prices.',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              property: 'og:title',
              content: 'Renegade',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              property: 'og:image',
              content: '/img/opengraph_docs.png',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              property: 'og:description',
              content: 'On-chain dark pool. MPC-based DEX for anonymous crosses at midpoint prices.',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:card',
              content: 'summary_large_image',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:title',
              content: 'Renegade',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:site',
              content: '@renegade_fi',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:creator',
              content: '@renegade_fi',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:description',
              content: 'On-chain dark pool. MPC-based DEX for anonymous crosses at midpoint prices.',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'twitter:image:src',
              content: 'https://stage.docs.renegade.fi/img/opengraph_docs.png',
            },
          },
        ],
      };
    }
  }
}
