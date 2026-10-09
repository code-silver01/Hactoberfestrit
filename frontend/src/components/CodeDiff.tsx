interface Props {
  diff: string;
}

export function CodeDiff({ diff }: Props) {
  if (!diff) return null;

  const lines = diff.split("\n");

  return (
    <div className="code-diff">
      {lines.map((line, i) => {
        let className = "line-context";
        if (line.startsWith("+")) className = "line-added";
        else if (line.startsWith("-")) className = "line-removed";

        return (
          <span key={i} className={className}>
            {line}
            {"\n"}
          </span>
        );
      })}
    </div>
  );
}
