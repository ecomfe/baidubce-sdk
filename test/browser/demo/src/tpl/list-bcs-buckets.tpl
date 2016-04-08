<!-- target: TPL_list_bcs_buckets -->
<!-- for: ${rows} as ${row} -->
<tr>
    <td><i class="fa fa-folder-o"></i> <a href="#/${row.bucket_name}">${row.bucket_name|i18n}/</a></td>
    <td>
        <div class="dropdown">
            <!-- if: ${row.acl} === 'public-read-write' -->
            <i class="fa fa-unlock public-read-write" title="公共（读写）" data-toggle="dropdown"></i>
            <!-- elif: ${row.acl} === 'public-read' -->
            <i class="fa fa-unlock-alt public-read" title="公共（只读）" data-toggle="dropdown"></i>
            <!-- else: -->
            <i class="fa fa-lock private" title="私有" data-toggle="dropdown"></i>
            <!-- /if -->
            <ul class="dropdown-menu" data-bucket-name="${row.bucket_name}">
                <li class="dropdown-header">设置访问权限</li>
                <li data-acl="private"><a href="javascript:void(0)">私有</a></li>
                <li data-acl="public-read"><a href="javascript:void(0)">公共（只读）</a></li>
                <li data-acl="public-read-write"><a href="javascript:void(0)">公共（读写）</a></li>
            </ul>
        </div>
        <!-- if: ${row.region} -->
        <i class="fa fa-map-marker" title="${row.region}"></i>
        <!-- /if -->
    </td>
    <td>文件夹</td>
    <td class="bucket-usage">
        <div class="progress" title="${row.used_capacity|filesize} / ${row.total_capacity|filesize}">
            <!-- var: progress = (100 * ${row.used_capacity}) / ${row.total_capacity}; -->
            <div class="progress-bar" role="progressbar"
                 aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"
                 style="width: ${progress}%;"></div>
        </div>
    </td>
    <td>${row.cdatetime|relativeTime(true)}</td>
</tr>
<!-- /for -->
