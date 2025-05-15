import { PrismaClient } from "@prisma/client";
import Image from "next/image";

export default async function Home() {

  const prisma = await PrismaClient

  return (
    <div className="m-4">
      <p>home page</p>
    </div>
  );
}
