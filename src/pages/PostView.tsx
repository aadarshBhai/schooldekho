import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { EventSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { PostDetail } from '@/components/PostDetail';

const PostView = () => {
  const { id } = useParams();

  // For SEO purposes, we might need to fetch data here or assume client-side rendering is enough.
  // Given the extensive changes, let's keep it simple: Page Wrapper around PostDetail.

  return (
    <>
      <div className="min-h-screen bg-black lg:bg-black/95 flex flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-0 lg:p-4 overflow-y-auto lg:overflow-hidden h-auto lg:h-[calc(100vh-64px)]">
          {id ? (
            <PostDetail
              eventId={id}
              className="max-w-[90rem] lg:h-full lg:max-h-[95vh]"
            />
          ) : (
            <div className="text-white text-center p-10">Event ID missing</div>
          )}
        </main>
      </div>
    </>
  );
};

export default PostView;
