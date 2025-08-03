// 年级验证器
export function gradeValidator(_rule: any, value: any): boolean | Error {
  if (value === null || value === undefined || value === '') {
    return new Error('请选择年级');
  }

  const numValue = Number(value);
  if (!Number.isInteger(numValue) || numValue < 1 || numValue > 12) {
    return new Error('请选择有效的年级（1-12）');
  }

  return true;
}

// 通用必填字段验证器
export function requiredValidator(fieldName: string) {
  return (_rule: any, value: any): boolean | Error => {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return new Error(
        `请${fieldName.includes('选择') ? '' : '输入'}${fieldName}`,
      );
    }
    return true;
  };
}

// 选项字段验证器（用于下拉选择）
export function selectValidator(fieldName: string, options: any[]) {
  return (_rule: any, value: any): boolean | Error => {
    if (value === null || value === undefined || value === '') {
      return new Error(`请选择${fieldName}`);
    }

    const validValues = options.map((option) => option.value);
    if (!validValues.includes(value)) {
      return new Error(`请选择有效的${fieldName}`);
    }

    return true;
  };
}
