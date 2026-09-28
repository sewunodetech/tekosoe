import { GraphQLClient } from 'graphql-request';

import { env } from './env';

// Sumber data untuk semua hal soal uang: pot, saldo, feed, status spend, hasil settle.
export const envio = env.envioGraphqlUrl ? new GraphQLClient(env.envioGraphqlUrl) : null;
