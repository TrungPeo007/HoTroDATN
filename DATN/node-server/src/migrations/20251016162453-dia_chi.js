'use strict';//giúp node js chạy nghiêm ngặt hơn bắt lỗi sớm, an toàn dễ debug cấm 1 số cú pháp nguy hiểm

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'token_expire', {
      type: Sequelize.DATE,
      comment: "token đăng ký và magic link",
      after: "token"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'token_expire');
  }
};
