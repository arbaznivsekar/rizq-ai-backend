// Ambient module declarations to satisfy TS in strict NodeNext mode without editing tsconfig
declare module 'googleapis' {
  export const google: any;
}
declare module 'nodemailer' {
  const nodemailer: any;
  export default nodemailer;
}
declare module 'bull' {
  const Bull: any;
  export default Bull;
}

