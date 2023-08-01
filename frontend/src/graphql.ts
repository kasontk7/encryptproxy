/**
 * Configuration for the graphql API
 */

// external modules
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';

/**
 * The apollo client config
 */
export default new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'https://localhost:5020/graphql',
    // credentials: 'include',
  }),
  connectToDevTools: true,
  queryDeduplication: true,
});
