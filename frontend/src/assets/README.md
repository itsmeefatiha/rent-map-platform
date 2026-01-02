Src assets (importable into components):

- Place images you want to import from React components here (e.g., `src/assets/images/my-image.png`).
- Import example:

  import myImage from '../assets/images/my-image.png';
  <img src={myImage} alt="My image" />

- Vite will bundle these files; use this for images that benefit from hashing or bundling.