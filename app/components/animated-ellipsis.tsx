export function AnimatedEllipsis() {
  return (
    <span className="inline-flex">
      <span className="animate-ellipsis">.</span>
      <span
        className="animate-ellipsis"
        style={{ animationDelay: "0.5s" }}
      >
        .
      </span>
      <span
        className="animate-ellipsis"
        style={{ animationDelay: "1s" }}
      >
        .
      </span>
    </span>
  )
}
