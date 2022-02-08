function getContent(url) {
    try {
      const response = UrlFetchApp.fetch(url);
      if (response.getResponseCode() == 200) {
        return response.getContentText();
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    };
}


function getAllReviews(){
  const content = getContent("https://www.rankingdak.com/");
  const $ = Cheerio.load(content);
  const cnos = [];

  const arr = $('.lgt > ul > li').toArray();
  arr.forEach((li) => {
    var href = $(li).find('a').attr('href');
    if (href) {
      var cno = href.substr(href.indexOf("cno1=")+5, 4);
      cnos.push(cno);
    };
  });
  Logger.log(cnos);

  cnos.forEach((cno)=>{
    Logger.log("cno="+ cno +" 시작");
    getProductByCno(cno);
  });
}


function getProductByCno(cno) {
  for(i = 1; i < 10000; i++){
    const content = getContent("https://www.rankingdak.com/main/exec.php?exec_file=skin_module/skin_ajax.php&_tmp_file_name=shop_big_section.php&single_module=shop_big_section&striplayout=1&module_page=" + i + "&cno1=" + cno);
    const $ = Cheerio.load(JSON.parse(content).content);
    // Logger.log(JSON.parse(content).content);
    const pnos = [];
    const arr = $('li > a').toArray();
    // Logger.log(arr.length);
    arr.forEach((a) => {
      var href = $(a).attr('href');
      if (href) {
        var pno = href.substr(href.indexOf("pno=") + 4, 32);
        var prdName = $(a).find('.prd_name').text();
        // Logger.log(prdName);
        pnos.push([pno, prdName]);
      };
    });

    if (pnos.length == 0) { return; }; 
    pnos.forEach((pno)=>{
      getReviewsByPno(pno[0], pno[1], cno);
      Logger.log("cno: " + cno + "pno: " + pno);
    });
  }
}


// 상품별로 첫번째 리뷰의 번호만 저장하는 배열
const firstReviews = [];


function getReviewsByPno(pno, prdName, cno) {
  const sheet = SpreadsheetApp.getActiveSheet();
  for(i = 1; i < 100000; i++){
    const content = getContent("https://www.rankingdak.com/main/exec.php?exec_file=skin_module/skin_ajax.php&obj_id=detail_review_ajax_list&_tmp_file_name=shop_detail.php&single_module=detail_review_list&striplayout=1&module_page=" + i + "&pno=" + pno + "&ctype=1&cno1=" + cno + "&rev_order=reg_date");
    Logger.log(JSON.parse(content).content);

    const $ = Cheerio.load(JSON.parse(content).content);
    const reviews = [];
    const arr = $('li').toArray();

    // 리뷰 수가 0이거나 첫번째 리뷰를 검사해 이미 있었던 리뷰라면 빠져나감
    if (i == 1) {
      if (arr.length == 0) { return; };
      const revNo = $(arr[0]).attr('onclick').substr(34, 6);
      Logger.log(revNo);

      firstReviews.forEach((rev) => {
        if(rev == revNo) { return ;};
      });

      firstReviews.push(revNo);
      Logger.log(firstReviews);
    }

    arr.forEach((li) => {
      const date = $(li).find(".date").text(); 
      if (!date) { return; };
      // Logger.log([cno, prdName, date]);
      reviews.push([cno, pno, prdName, date]);
    });
    if (reviews.length == 0) { return; };
    sheet.getRange(sheet.getLastRow() + 1, 1, reviews.length, 4).setValues(reviews);
    Logger.log("page: " + i + ", reviews: " + reviews);
  };
}
