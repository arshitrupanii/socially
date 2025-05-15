import CreatePost from "@/components/createPost";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function Home() {

  const user = await currentUser();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}
      </div>
      <div className="hidden lg:col-span-4 lg:block sticky top-20">
          whotoFollow
      </div>
    </div>
  );
}
