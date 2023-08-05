// Lighter weight approach than tailwind-merge.
// Just join className strings, with override provided using Tailwind ! important modifier.
// ref: https://github.com/dcastil/tailwind-merge/blob/v1.13.2/docs/when-and-how-to-use-it.md#using-tailwinds-important-modifier
export function join(...args: any) {
  return args.filter(Boolean).join(' ')
}
