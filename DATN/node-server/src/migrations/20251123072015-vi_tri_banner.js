'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('banner' , 'vi_tri', {
      type: Sequelize.ENUM( 'home_top',
    'home_middle',
    'home_bottom',
    'home_slider',
    'popup'),
      after: "img"
      ,defaultValue: null
    });
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('banner', 'vi_tri');
   
  }
};
