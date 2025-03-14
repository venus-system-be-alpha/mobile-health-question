/*--------------------------------------------------------------------------
 * myscript.js - メイン処理
 * ver 1.0.0.0 (Jul. 31th, 2019)
 *
 * created and maintained by takeo nakashima
 * 
 * Copyright(C) System Be-Alpha Corporation All Rights Reserved.
 *------------------------------------------------------------------------*/

$(function () {

    console.log(location.search);

    var qcount = { datacount: data.length };

    // 質問トータルテンプレートに出力
    var qcounttmp = $.templates("#qindexTemplate");
    $("#qindex").html(qcounttmp.render(qcount));

    // 問診票テンプレート
    // ラジオボタンのIDを作成する
    // *外部データ json のdataにプロパティcustomindexを追加
    let radio_idx = 1;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].Answer.length; j++) {
            data[i].Answer[j].customindex = radio_idx;
            radio_idx++;
        }
    }

    // 問診票テンプレートに出力
    var qtmpl = $.templates("#questionTemplate");
    $("#jsrenderResult").html(qtmpl.render(data));

    // 全てのラジオボタンをOFF
    $('input:radio').attr('checked', false);

    // 前回の結果を復元
    Undo();

    const mySiema = new Siema({
        selector: '#jsrenderResult'
        , draggable: false
        , duration: 200
        , onInit: printSlideIndex
        , onChange: printSlideIndex
    });

    // 前ボタン
    $('.prev').click(() => {
        mySiema.prev();
    });

    // 次ボタン
    $('.next').click(() => {

        // 現在回答中のindex
        const answer = IsAnswer(Number($('.js-index').text()) - 1);

        if (answer) {
            mySiema.next();
        } else {
            $('#modal-nextcheck').modal('show');
        }

    });

    // 現在回答中の質問番号を設定する
    function printSlideIndex() {

        $('.js-index').html(this.currentSlide + 1);
        $('.prev').prop('disabled', false);
        $('.next').prop('disabled', false);

        // 前ボタンをdisable
        if (this.currentSlide === 0) {
            $('.prev').prop('disabled', true);
        }

        // 次ボタンをdisable
        if (this.currentSlide === (data.length - 1)) {
            $('.next').prop('disabled', true);
        }
    }

    // やり直し ボタンクリック処理
    $('.fa.fa-refresh').click(() => {

        localStorage.removeItem('venus-medical');

        // 全てのラジオボタンをOFF
        $('input:radio').prop('checked', false);

        mySiema.goTo(0);

    });


    // ラジオボタンイベント
    $('input[name="customRadio"]:radio').change(() => {

        if (localStorage.getItem('venus-medical') == null) {

            // 次の質問indexを取得
            const answer = IsAnswer(Number($('.js-index').text()));

            // 次問が未回答の場合のみ
            if (!answer) {
                setTimeout(() => mySiema.next(), 1000);
            }
        }
    });


    // QRコード作成 ボタンクリック処理
    $('.fa.fa-qrcode').click(() => {

        let idx_answer = 0;
        let qa = "";
        let answer = true;
        let noanswer = [];

        // 質問に全て回答したか？
        $('fieldset').each(function () {

            idx_answer++;

            let r = String($(this).find("input[name='customRadio']:checked").val());

            if (r == 'undefined') {

                answer = false;
                noanswer.push(idx_answer);
            }

            qa += r;

        });

        // 質問回答をしてない場合はダイアログをコール
        if (!answer) {

            $('.no-answer').empty();
            $('.no-answer').append('<h6>未回答</h6><p class="alert alert-info">' + noanswer.join('　') + '</p>');
            $('#modal-answer').modal('show');

            return false;
        }

        console.log('localstrage:' + qa);

        localStorage.setItem('venus-medical', qa);

        const today = new Date();
        const year = today.getFullYear();
        const month = ('00' + (today.getMonth() + 1)).slice(-2);
        const date = ('00' + today.getDate()).slice(-2);

        // 今日のシステム日付を先頭に付加
        qa = year + month + date + qa;

        // html 引数を末尾に付加
        const argument = location.search.replace('?', '');

        qa = argument + ('x').repeat(30 - argument.length) + qa;

        // 生成するQRコード
        // 引数(30桁揃え)  + yyyyMMdd + 回答結果

        console.log('qrcode:' + qa);

        // QRコードを作成する
        $('#qrcode').empty();
        $('#qrcode').qrcode({
            text: qa
            , background: "#fff"
            , foreground: "#000"
        });

        const canvas = $('canvas');
        const qrcode_src = canvas[0].toDataURL();
        $('#qrcode-img').attr('src', qrcode_src);
        $('#modal-qrcode').modal('show');

        return false;

    });

});


// 前回の回答結果を復元する
function Undo() {

    const qa = localStorage.getItem('venus-medical');

    if (qa == null) {
        return;
    }

    let aryqaidx = 0;
    const aryqa = qa.split('');

    $('fieldset').each(function () {

        $(this).find("input[name='customRadio']").val([aryqa[aryqaidx]]);

        aryqaidx++;

    });
}

// 回答状態をチェックする
function IsAnswer(idx) {

    let answer = true;
    let qindex = 0;

    $('.form-group').each(function () {

        if (qindex == idx) {

            let r = String($(this).find("input[name='customRadio']:checked").val());

            if (r == 'undefined') {

                answer = false;
                return false;
            }
        }

        qindex++;
    });

    return answer;

}