import MP4Box from 'mp4box';

export function getMimeType (buffer) {
  return new Promise((resolve, reject) => {
    const mp4boxfile = MP4Box.createFile();

    mp4boxfile.onReady = (info) => resolve(info.mime);
    mp4boxfile.onError = () => reject();

    buffer.fileStart = 0;
    mp4boxfile.appendBuffer(buffer);
  });
}

/**
 * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，最多每隔 wait毫秒调用一次该函数
 * @param func 执行函数
 * @param wait 时间间隔
 * @param options 如果你想禁用第一次首先执行的话，传递{leading: false}，
 *                如果你想禁用最后一次执行的话，传递{trailing: false}
 * @returns {Function}
 */
export function throttle(func, wait, options) {
  let context, args, result;  //this上下文，参数，返回值
  let timeout = null;  //定时器id
  let previous = 0;   //上次执行的时间
  if (!options) options = {}; //禁用首次或者末次执行

  let later = function () { //remaining秒之后执行方法
      //初始化函数
      previous = options.leading === false ? 0 : new Date().getTime(); //没有禁用第一次执行，则previous=0
      timeout = null;  //初始化定时器id
      result = func.apply(context, args); //执行方法
      context = args = null;
  };
  return function () {
      let now = new Date().getTime();   //获取当前时间

      if (!previous && options.leading === false) {
          //当第一次执行时，如果禁用第一次执行(options.leading),将本次执行时间赋值给上次执行
          previous = now
      }

      let remaining = wait - (now - previous);   //用时间间隔wait减去（本次运行的时间now-上次运行的时间previous），使时间间隔为wait
      context = this;   //获取当前环境this
      args = arguments; //获取函数参数

      if (remaining <= 0 || remaining > wait) { //如果两次方法执行时间间隔刚好为wait，或者大于wait，
          previous = now;  //将本次时间赋值给上次
          result = func.apply(context, args);   //执行方法
          context = args = null
          
      } else if (!timeout && options.trailing !== false) {
          // 时间间隔小于wait,且定时器不存在，且最后一次执行
          timeout = setTimeout(later, remaining);  //在remaining时间后执行方法，remaining为距离wait所剩余的时间
      }
      return result;
  };
}

/**
 * 防反跳。func函数在最后一次调用时刻的wait毫秒之后执行！
 * @param func 执行函数
 * @param wait 时间间隔
  * @param options 如果你想第一次首先执行的话，传递{leading: true}，
 *                如果你想最后一次执行的话，传递{trailing: true}
 * @returns {Function}
 */

export function debounce(func, wait, options) {
  let timeout, args, context, timestamp, result;
  let later = function () {
      let last = new Date().getTime() - timestamp; // timestamp会实时更新
      if (last < wait && last >= 0) {  //如果定时器执行时间距离上次函数调用时间，大于0，小于wait，则重新生成定时器，时间间隔为距离wait所剩余的时间
          timeout = setTimeout(later, wait - last);
      } else {
          timeout = null;  //清除定时器
          if (options.trailing) {  //如果定义时间间隔后执行
              result = func.apply(context, args);
              if (!timeout) context = args = null;
          }
      }
  };
  return function () {
      context = this;   //绑定函数上下文
      args = arguments;
      timestamp = new Date().getTime();  //当前执行方法时间
      let callNow = options.leading && !timeout;
      if (!timeout) {
          //生成定时器
          timeout = setTimeout(later, wait);
      }
      if (callNow) { //如果定义首次执行
          //立即执行
          result = func.apply(context, args);
          context = args = null;
      }
      return result;
  };
}

