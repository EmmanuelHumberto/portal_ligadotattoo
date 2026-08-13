const nextConfig={
 experimental:{useTypeScriptCli:false},
 poweredByHeader:false,
 compress:true,
 images:{
  formats:['image/avif','image/webp'],
  minimumCacheTTL:3600,
  remotePatterns:[
   {protocol:'https',hostname:process.env.MEDIA_PUBLIC_HOST??'media.example'},
  ],
 },
 async headers(){
  return [{
   source:'/:path*',
   headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
   ],
  }];
 },
};
export default nextConfig;
