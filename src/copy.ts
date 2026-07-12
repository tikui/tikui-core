import copy from 'recursive-copy';

type FirstOverloadParameters<T> = T extends {
  (...args: infer A): unknown;
  (...args: never[]): unknown;
} ? A : never;

// recursive-copy does not export its Options type: extract it from the first overload of the copy function
export type CopyOptions = NonNullable<FirstOverloadParameters<typeof copy>[2]>;

export { copy };
