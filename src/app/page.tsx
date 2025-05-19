import CreatePost from "@/components/createPost";
import { currentUser } from "@clerk/nextjs/server";
import WhotoFollow from "@/components/WhotoFollow";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { getPost } from "@/actions/post.action";
import PostCard from "@/components/Postcard";
import { getDbUser } from "@/actions/user.action";

export default async function Home() {

  const user = await currentUser();
  const posts = await getPost();
  const dbUserId = await getDbUser();


  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div className="space-y-6">
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>

      </div>
      <div className="hidden lg:col-span-4 lg:block sticky top-20">
        <WhotoFollow />
      </div>
      <Toaster/>
    </div>
  );
}
