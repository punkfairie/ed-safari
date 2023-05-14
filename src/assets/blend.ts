/** @module blend */

// https://www.30secondsofcode.org/js/s/weighted-average/
function weightedAverage(numbers: number[], weights: number[]): number {
    const [sum, weightSum] = weights.reduce(
        (previous, current, index) => {
            previous[0] = previous[0] + numbers[index] * current;
            previous[1] = previous[1] + current;
            return previous;
        },
        [0, 0]
    );

    return sum / weightSum;
}

type colorArray = [number, number, number];
type colorObject = {red: number, green: number, blue: number};
type color = colorArray | colorObject;

/**
 *
 * @param {(number[]|{red: number, green: number, blue: number})} color1 - As array
 *     [red, green, blue], or object {red, green, blue}.
 * @param {(number[]|{red: number, green: number, blue: number})} color2
 * @param {number[]} [weights = [1, 1]] - Weight of each color, as a percentage of 1 (e.g. 0.7).
 * @returns {(number[]|{red: number, green: number, blue: number})} If both input colors are arrays,
 *     array is returned. Otherwise object is returned.
 */

// https://dev.to/bytebodger/color-mixing-with-javascript-1llh
export function blend(color1: color, color2: color, weights: [number, number] = [1, 1]): color {
    const one = {
        red: Array.isArray(color1) ? color1[0] : color1.red,
        green: Array.isArray(color1) ? color1[1] : color1.green,
        blue: Array.isArray(color1) ? color1[2] : color1.blue,
    }
    const two = {
        red: Array.isArray(color2) ? color2[0] : color2.red,
        green: Array.isArray(color2) ? color2[1] : color2.green,
        blue: Array.isArray(color2) ? color2[2] : color2.blue,
    }

    const result = {
        red: weightedAverage([one.red, two.red], weights),
        green: weightedAverage([one.green, two.green], weights),
        blue: weightedAverage([one.blue, two.blue], weights),
    }

    if (Array.isArray(color1) && Array.isArray(color2)) {
        return [
            result.red,
            result.green,
            result.blue,
        ];
    } else {
        return {
            red: result.red,
            green: result.green,
            blue: result.blue,
        }
    }
}