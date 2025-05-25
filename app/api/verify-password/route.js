export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json({ error: "請提供密碼" }, { status: 400 });
    }

    // 從環境變量獲取正確的密碼
    const correctPassword = process.env.ACCESS_PASSWORD;
    
    if (!correctPassword) {
      return Response.json({ error: "伺服器未配置訪問密碼" }, { status: 500 });
    }

    // 驗證密碼
    const isValid = password === correctPassword;
    
    if (isValid) {
      return Response.json({ 
        success: true, 
        message: "密碼驗證成功" 
      });
    } else {
      return Response.json({ 
        success: false, 
        error: "密碼錯誤" 
      }, { status: 401 });
    }
  } catch (error) {
    console.error("Password verification error:", error);
    return Response.json(
      { error: "密碼驗證時發生錯誤" }, 
      { status: 500 }
    );
  }
} 