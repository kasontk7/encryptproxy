import React from 'react';
import './App.css';
import apolloClient from './graphql';
import { ApolloProvider } from 'react-apollo';
import Root from './Root';

const App = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <Root />
    </ApolloProvider>
  );
};

export default App;
