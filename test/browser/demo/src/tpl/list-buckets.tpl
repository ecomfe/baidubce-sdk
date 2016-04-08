<!-- target: TPL_list_buckets(master=TPL_bos) -->
<!-- block: body -->
<!-- for: ${rows} as ${row} -->
<tr>
    <!-- if: ${row.is_dir} -->
    <td><i class="fa fa-folder-o"></i> <a href="#/!bos/${row.name}">${row.name|i18n}/</a></td>
    <!-- else -->
    <td><i class="fa ${row.name|fa_icon}"></i> ${row.name}</td>
    <!-- /if -->
    <td>
        <div class="dropdown">
            <!-- if: ${row.acl} === 'public-read-write' -->
            <i class="fa fa-unlock public-read-write" title="公共（读写）" data-toggle="dropdown"></i>
            <!-- elif: ${row.acl} === 'public-read' -->
            <i class="fa fa-unlock-alt public-read" title="公共（只读）" data-toggle="dropdown"></i>
            <!-- else: -->
            <i class="fa fa-lock private" title="私有" data-toggle="dropdown"></i>
            <!-- /if -->
            <ul class="dropdown-menu" data-bucket-name="${row.name}">
                <li class="dropdown-header">设置访问权限</li>
                <li data-acl="private"><a href="javascript:void(0)">私有</a></li>
                <li data-acl="public-read"><a href="javascript:void(0)">公共（只读）</a></li>
                <li data-acl="public-read-write"><a href="javascript:void(0)">公共（读写）</a></li>
            </ul>
        </div>
    </td>
    <td>文件夹</td>
    <td>${row.location}</td>
    <td>${row.creationDate|relativeTime}</td>
</tr>
<!-- /for -->
<!-- /block -->
