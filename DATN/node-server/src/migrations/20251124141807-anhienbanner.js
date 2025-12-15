'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('banner','an_hien',{
      type: Sequelize.TINYINT(1),
      after: "vi_tri",
      defaultValue: 1,
      comment: "1 hien 0 an"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('banner', 'an_hien');
    
  }
};
