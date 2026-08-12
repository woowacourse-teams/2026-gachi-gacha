export type AsyncState<TData, TError = Error> =
  | { status: 'loading' }
  | { status: 'success'; data: TData }
  | { status: 'error'; error: TError };
