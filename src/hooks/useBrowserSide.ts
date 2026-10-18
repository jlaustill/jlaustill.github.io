function useBrowserSide(): boolean {
  return typeof window !== 'undefined';
}

export default useBrowserSide;
