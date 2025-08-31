import bcrypt from "bcrypt";

export const hashData = async (data: string) => {
  const saltRounds = 12;
  return await bcrypt.hash(data, saltRounds);
};

export const compareHashedData = async (data: string, hash: string) => {
  return await bcrypt.compare(data, hash);
};
