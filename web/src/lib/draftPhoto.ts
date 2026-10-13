let draftPhoto: File | null = null;
export const setDraftPhoto = (file: File | null) => { draftPhoto = file; };
export const takeDraftPhoto = () => { const file = draftPhoto; draftPhoto = null; return file; };
