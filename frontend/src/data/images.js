/** Curated healthcare images — verified Unsplash IDs with crop params */

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: u('photo-1576091160399-112ba8d25d1d', 1600),
  peshawar: u('photo-1519494026892-80bbd2d6fd0d', 1600),
  doctor: u('photo-1559839734-2b71ea197ec2', 800),
  hospital: u('photo-1584433144859-1fc3ab64a957', 800),
  patient: u('photo-1631217868264-e5b90bb7e133', 800),
  pharmacy: u('photo-1584308666744-24d5c474f2ae', 800),
  team: u('photo-1522071820081-009f0129c71c', 800),
  emergency: u('photo-1516549655169-df83a0774514', 800),
  queue: u('photo-1551601651-2a8555f1a136', 800),
  ai: u('photo-1486312338219-ce68d2c6f44d', 800),
  blood: u('photo-1622253692010-333f2da6031d', 800),
  contact: u('photo-1454165804606-c3d57bc86b40', 1600),
  login: u('photo-1576091160550-2173dba999ef', 1600),
  register: u('photo-1594824476967-48c8b964273f', 1600),
};

/** Gradient fallback when remote image fails */
export const IMAGE_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#1e40af"/><stop offset="1" stop-color="#4338ca"/>
      </linearGradient></defs>
      <rect width="800" height="500" fill="url(#g)"/>
      <circle cx="400" cy="220" r="48" fill="white" fill-opacity="0.12"/>
      <path d="M400 248c-14-11-22-19-22-28a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 9-8 17-22 28Z" fill="white" fill-opacity="0.9"/>
    </svg>`
  );
