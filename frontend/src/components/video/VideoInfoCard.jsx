export default function VideoInfoCard({ video, transcriptStatus }) {
  return (
    <div className="glass rounded-3xl p-5 shadow-2xl">
      <h3 className="text-lg font-semibold">Video Information</h3>

      {video ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm text-muted">Title</p>
            <h4 className="text-base font-semibold">{video.title}</h4>
          </div>

          <div>
            <p className="text-sm text-muted">Channel</p>
            <p>{video.channelTitle || "Unknown channel"}</p>
          </div>

          <div>
            <p className="text-sm text-muted">Description</p>
            <p className="line-clamp-5 text-sm text-muted">
              {video.description || "No description available"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs">
              Transcript: {transcriptStatus}
            </span>
            {video.duration ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs">
                Duration: {video.duration}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Import a video to see metadata here.
        </p>
      )}
    </div>
  );
}