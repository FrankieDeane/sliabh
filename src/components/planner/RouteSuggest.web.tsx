/**
 * The route suggester is for the phone app only (Android and iOS), where it
 * runs with no signal on the trail. The site does not offer it, and this
 * empty stand-in keeps the routing engine out of the web bundle.
 */
export function RouteSuggest(_props: { c: unknown }) {
  return null;
}
