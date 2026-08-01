// Thin compatibility shim — delegates to features/camp/api.js.
// Existing hooks (useCamp.js) import this; new code should import
// from @/features/camp/api directly.
export { campApi as default } from '@/features/camp/api';
