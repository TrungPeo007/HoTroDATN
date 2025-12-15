'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('dia_chi_user' , 'ho_ten', {
      type: Sequelize.STRING,
      after: "id_user"
    });
    await queryInterface.addColumn('dia_chi_user','dien_thoai',{
      type: Sequelize.STRING,
      after: "ho_ten"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('dia_chi_user', 'ho_ten');
    await queryInterface.removeColumn('dia_chi_user','dien_thoai');
  }
};
