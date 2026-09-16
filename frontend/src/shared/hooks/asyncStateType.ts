export type AsyncState<T> =
  | {
      status: 'idle';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'loading';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'success';
      data: T;
      errorMessage: null;
    }
  | {
      status: 'error';
      data: null;
      errorMessage: string;
    };
