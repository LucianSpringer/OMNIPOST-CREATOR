/**
 * REFACTOR: Re-exporting Compound Component
 * The monolithic PostCard component has been decomposed into subcomponents in the ./PostCard directory.
 * This re-export ensures backward compatibility for imports while providing the new compound component API.
 */
export { PostCard } from './PostCard/index';
