import Reference from './Reference';

/**
 * Represents a collection of sources with a search engine, search query and references.
 */
export default interface Sources {
  /** The search engine used to retrieve the sources. */
  search_engine: string;
  /** The search query used to retrieve the sources. */
  search_query: string;
  /** An array of references. */
  references: Reference[];
}
