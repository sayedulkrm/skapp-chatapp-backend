export const CatchAsyncError = (passedFunction) => async (req, res, next) => {
    // Promise.resolve(passedFunction(req, res, next)).catch(next);

    try {
        await passedFunction(req, res, next);
    } catch (error) {
        next(error);
    }
};
