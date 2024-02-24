const asyncHandler = (func) => {
    return (request, response, next) => {
        Promise.resolve(func(request, response, next)).catch((error) => {
            next(error);
        });
    };
};

export default asyncHandler;

/* const asyncHandler = (func) => {
    async (request, response, next) => {
        await func(request, response, next);
        try {
        } catch (error) {
            response.status(error.code || 500).json({
                success: false,
                message: error.msg,
            });
        }
    };
};

export default asyncHandler;
*/
