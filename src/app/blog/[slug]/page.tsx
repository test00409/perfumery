import Image from "next/image";
import homepage from "../../../app/data/homepage.json";
import { notFound } from "next/navigation";

export default function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogSection = homepage.sections.find(
    (s: any) => s.id === "blogSection"
  );
  const posts = blogSection?.props?.posts;
  if (!Array.isArray(posts)) {
    return notFound();
  }
  const blog = posts.find((p: any) => p.slug === params.slug);

  if (!blog) return notFound();

  return (
    <section className="bg-white py-20 pt-[150px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6">
        <p className="text-[14px] text-gray-500 mb-3">{blog.date}</p>

        <h1 className="text-[18px] md:text-[20px] text-gray-900 font-meduim mb-6">
          {blog.title}
        </h1>

        <div className="relative w-full h-[420px] mb-10 rounded-xl overflow-hidden">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <p className="text-gray-900 leading-relaxed text-[20px]">
          {blog.description}
        </p>
      </div>
    </section>
  );
}
