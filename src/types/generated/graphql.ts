import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Ministry = Record & {
  __typename?: 'Ministry';
  archived?: Maybe<Scalars['Boolean']>;
  color?: Maybe<Scalars['String']>;
  creationTimestamp?: Maybe<Scalars['Int']>;
  id?: Maybe<Scalars['Int']>;
  modificationTimestamp?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};

export type MinistryAddInput = {
  color?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

export type MinistryUpdateInput = {
  color?: InputMaybe<Scalars['String']>;
  id: Scalars['Int'];
  name?: InputMaybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addMinistry: Ministry;
  deleteMinistry: Scalars['Int'];
  updateMinistry: Ministry;
};


export type MutationAddMinistryArgs = {
  ministryAddInput?: InputMaybe<MinistryAddInput>;
};


export type MutationDeleteMinistryArgs = {
  ministryId: Scalars['Int'];
};


export type MutationUpdateMinistryArgs = {
  ministryUpdateInput?: InputMaybe<MinistryUpdateInput>;
};

export type Query = {
  __typename?: 'Query';
  ministries?: Maybe<Array<Maybe<Ministry>>>;
  ministryById?: Maybe<Ministry>;
  test?: Maybe<Scalars['Int']>;
};


export type QueryMinistriesArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  order?: InputMaybe<SortOrder>;
  page?: InputMaybe<Scalars['Int']>;
};


export type QueryMinistryByIdArgs = {
  ministryId: Scalars['Int'];
};

export type Record = {
  creationTimestamp?: Maybe<Scalars['Int']>;
  modificationTimestamp?: Maybe<Scalars['Int']>;
};

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Ministry: ResolverTypeWrapper<Ministry>;
  MinistryAddInput: MinistryAddInput;
  MinistryUpdateInput: MinistryUpdateInput;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Record: ResolversTypes['Ministry'];
  SortOrder: SortOrder;
  String: ResolverTypeWrapper<Scalars['String']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean'];
  Int: Scalars['Int'];
  Ministry: Ministry;
  MinistryAddInput: MinistryAddInput;
  MinistryUpdateInput: MinistryUpdateInput;
  Mutation: {};
  Query: {};
  Record: ResolversParentTypes['Ministry'];
  String: Scalars['String'];
};

export type MinistryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Ministry'] = ResolversParentTypes['Ministry']> = {
  archived?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creationTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  modificationTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addMinistry?: Resolver<ResolversTypes['Ministry'], ParentType, ContextType, RequireFields<MutationAddMinistryArgs, never>>;
  deleteMinistry?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationDeleteMinistryArgs, 'ministryId'>>;
  updateMinistry?: Resolver<ResolversTypes['Ministry'], ParentType, ContextType, RequireFields<MutationUpdateMinistryArgs, never>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  ministries?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ministry']>>>, ParentType, ContextType, RequireFields<QueryMinistriesArgs, never>>;
  ministryById?: Resolver<Maybe<ResolversTypes['Ministry']>, ParentType, ContextType, RequireFields<QueryMinistryByIdArgs, 'ministryId'>>;
  test?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type RecordResolvers<ContextType = any, ParentType extends ResolversParentTypes['Record'] = ResolversParentTypes['Record']> = {
  __resolveType: TypeResolveFn<'Ministry', ParentType, ContextType>;
  creationTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  modificationTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Ministry?: MinistryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Record?: RecordResolvers<ContextType>;
};

