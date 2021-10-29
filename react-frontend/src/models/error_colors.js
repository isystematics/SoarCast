const error_colors = {
    Green: '#8cf58f',
    Red: '#b22a00',
    Blue: '#2979ff',
    Orange: '#ff6333',
    White: '#ffffff',
    Black: '#333',
    Light_Red: '#fde1e1',
    getType: (type) => {
        switch(type){
            case 0:
                return error_colors.Green;
            case 1:
                return error_colors.Red;
            case 2:
                return error_colors.Blue;
            case 3:
                return error_colors.Orange;
            case 4:
                return error_colors.White;
            case 5:
                return error_colors.Black;
            case 6:
                return error_colors.Light_Red;
        }
    }
}
export default error_colors;