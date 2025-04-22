import { ProjectSkeleton } from "./components/project-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <ProjectSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
